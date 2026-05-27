import { Bot } from 'grammy';
import { MyContext } from '../types';
import { adminPanelKeyboard, mainKeyboard } from '../keyboards';
import { DBManager } from './state';
import { MESSAGES } from '../constants';

export function setupAdminHandlers(bot: Bot<MyContext>) {
	const adminMiddleware = async (ctx: MyContext, next: () => Promise<void>) => {
		if (ctx.from?.id.toString() === ctx.env.ADMIN_ID) {
			await next();
		}
	};

	bot.command('admin', adminMiddleware, async (ctx) => {
		await ctx.reply("👨‍💻 *Admin Panel*", { reply_markup: adminPanelKeyboard, parse_mode: 'Markdown' });
	});

	bot.hears('📊 Statistics', adminMiddleware, async (ctx) => {
		const db = new DBManager(ctx.env.DB);
		const stats = await db.getStats();
		const msg = `📊 *Bot Statistics*\n\n👥 Total Users: ${stats.totalUsers}\n💰 Total Balance in Ecosystem: ${stats.totalBalance} USDT\n✅ Approved Withdrawals: ${stats.approvedWithdrawals}`;
		await ctx.reply(msg, { parse_mode: 'Markdown' });
	});

	bot.hears('📢 Broadcast', adminMiddleware, async (ctx) => {
		const db = new DBManager(ctx.env.DB);
		await db.updateState(ctx.from!.id, 'admin_awaiting_broadcast');
		await ctx.reply("📢 *Send the message you want to broadcast to all users.*", { parse_mode: 'Markdown', reply_markup: mainKeyboard });
	});

	bot.hears('🏠 Back to User Menu', adminMiddleware, async (ctx) => {
		await ctx.reply("🏠 *Returned to Main Menu*", { reply_markup: mainKeyboard, parse_mode: 'Markdown' });
	});

	bot.callbackQuery(/approve_(\d+)/, adminMiddleware, async (ctx) => {
		const withdrawId = parseInt(ctx.match![1]);
		const db = new DBManager(ctx.env.DB);
		
		const withdrawal = await db.getWithdrawal(withdrawId);
		if (!withdrawal || withdrawal.status !== 'pending') return ctx.answerCallbackQuery("Already processed or not found.");

		await db.updateWithdrawalStatus(withdrawId, 'approved');
		await ctx.api.sendMessage(withdrawal.user_id, MESSAGES.WITHDRAW_APPROVED.replace('{amount}', withdrawal.amount.toString()), { parse_mode: 'Markdown' }).catch(() => {});
		
		await ctx.editMessageText(ctx.callbackQuery.message!.text + "\n\n✅ *STATUS: APPROVED*", { parse_mode: 'Markdown' });
		await ctx.answerCallbackQuery("Approved!");
	});

	bot.callbackQuery(/reject_(\d+)/, adminMiddleware, async (ctx) => {
		const withdrawId = parseInt(ctx.match![1]);
		const db = new DBManager(ctx.env.DB);
		
		const withdrawal = await db.getWithdrawal(withdrawId);
		if (!withdrawal || withdrawal.status !== 'pending') return ctx.answerCallbackQuery("Already processed or not found.");

		await db.updateWithdrawalStatus(withdrawId, 'rejected');
		await db.refundBalance(withdrawal.user_id, withdrawal.amount);
		await ctx.api.sendMessage(withdrawal.user_id, MESSAGES.WITHDRAW_REJECTED, { parse_mode: 'Markdown' }).catch(() => {});
		
		await ctx.editMessageText(ctx.callbackQuery.message!.text + "\n\n❌ *STATUS: REJECTED*", { parse_mode: 'Markdown' });
		await ctx.answerCallbackQuery("Rejected!");
	});
}
