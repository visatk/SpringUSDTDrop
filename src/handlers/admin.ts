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
		const msg = `📊 *Bot Statistics*\n\n👥 Total Users: ${stats.totalUsers}\n💰 Total Balance: ${stats.totalBalance} USDT\n✅ Approved Withdrawals: ${stats.approvedWithdrawals}`;
		await ctx.reply(msg, { parse_mode: 'Markdown' });
	});

	bot.hears('📢 Broadcast', adminMiddleware, async (ctx) => {
		const db = new DBManager(ctx.env.DB);
		await db.updateState(ctx.from!.id, 'admin_awaiting_broadcast');
		await ctx.reply("📢 *Send the message (Text/Media) you want to broadcast.*", { parse_mode: 'Markdown', reply_markup: mainKeyboard });
	});

	bot.hears('🏠 Back to User Menu', adminMiddleware, async (ctx) => {
		const db = new DBManager(ctx.env.DB);
		await db.updateState(ctx.from!.id, 'idle');
		await ctx.reply("🏠 *Returned to Main Menu*", { reply_markup: mainKeyboard, parse_mode: 'Markdown' });
	});

	// Background Broadcaster to prevent Webhook Timeout
	bot.on('message', adminMiddleware, async (ctx, next) => {
		const db = new DBManager(ctx.env.DB);
		const user = await db.getUser(ctx.from!.id);
		
		if (user?.state === 'admin_awaiting_broadcast') {
			await db.updateState(user.id, 'idle');
			await ctx.reply("⏳ *Broadcast started in the background...*", { parse_mode: 'Markdown', reply_markup: adminPanelKeyboard });
			
			// executionCtx.waitUntil pushes the loop to background
			ctx.executionCtx.waitUntil((async () => {
				const users = await db.getAllUserIds();
				let success = 0;
				const chunkSize = 25; // Safe limit against Telegram Error 429
				
				for (let i = 0; i < users.length; i += chunkSize) {
					const chunk = users.slice(i, i + chunkSize);
					const results = await Promise.allSettled(
						chunk.map(uid => ctx.api.copyMessage(uid, ctx.chat.id, ctx.message.message_id))
					);
					success += results.filter(r => r.status === 'fulfilled').length;
					await new Promise(res => setTimeout(res, 1000)); // Delay between chunks
				}
				await ctx.api.sendMessage(ctx.from!.id, `✅ *Broadcast completed!*\n\nDelivered to ${success} users.`, { parse_mode: 'Markdown' });
			})());
			return;
		}
		await next(); // Proceed to user handlers if not a broadcast
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
