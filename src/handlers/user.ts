import { Bot } from 'grammy';
import { MyContext } from '../types';
import { MESSAGES, REWARDS } from '../constants';
import { continueKeyboard, mainKeyboard, cancelKeyboard, adminPanelKeyboard } from '../keyboards';
import { DBManager } from './state';

export function setupUserHandlers(bot: Bot<MyContext>) {
	bot.command('start', async (ctx) => {
		const db = new DBManager(ctx.env.DB);
		const user = ctx.from!;
		const referredBy = ctx.match ? parseInt(ctx.match) : undefined;
		const existingUser = await db.getUser(user.id);
		
		if (!existingUser) {
			const validReferral = (referredBy && referredBy !== user.id) ? referredBy : undefined;
			await db.createUser(user.id, user.first_name, user.username, validReferral);
            if(validReferral) await db.addReferralBonus(validReferral, REWARDS.REFERRAL_BONUS);
		}

		await db.updateState(user.id, 'idle');
		await ctx.reply(MESSAGES.WELCOME, { reply_markup: continueKeyboard, parse_mode: 'Markdown' });
	});

	bot.callbackQuery('action_continue', async (ctx) => {
		const db = new DBManager(ctx.env.DB);
		await db.updateState(ctx.from.id, 'awaiting_wallet');
		await ctx.answerCallbackQuery();
		await ctx.reply(MESSAGES.ASK_WALLET, { reply_markup: cancelKeyboard, parse_mode: 'Markdown' });
	});

	bot.on('message:text', async (ctx) => {
		const text = ctx.message.text;
		const db = new DBManager(ctx.env.DB);
		const user = await db.getUser(ctx.from.id);
		if (!user) return;

		// Cancel Action
		if (text === '❌ Cancel') {
			await db.updateState(user.id, 'idle');
			await ctx.reply(MESSAGES.CANCELLED, { reply_markup: mainKeyboard, parse_mode: 'Markdown' });
			return;
		}

		// Admin Broadcast Logic
		if (user.state === 'admin_awaiting_broadcast' && user.id.toString() === ctx.env.ADMIN_ID) {
			await ctx.reply("⏳ *Broadcasting message...*", { parse_mode: 'Markdown' });
			const users = await db.getAllUserIds();
			let success = 0;
			for (const uid of users) {
				try {
					await ctx.api.copyMessage(uid, ctx.chat.id, ctx.message.message_id);
					success++;
				} catch (e) { /* ignore blocked bots */ }
			}
			await db.updateState(user.id, 'idle');
			await ctx.reply(`✅ *Broadcast completed!*\n\nDelivered to ${success} users.`, { parse_mode: 'Markdown', reply_markup: adminPanelKeyboard });
			return;
		}

		// Awaiting Wallet
		if (user.state === 'awaiting_wallet') {
			const bep20Regex = /^0x[a-fA-F0-9]{40}$/;
			if (!bep20Regex.test(text)) return ctx.reply(MESSAGES.INVALID_WALLET, { parse_mode: 'Markdown' });
			await db.saveWalletAndReward(user.id, text, REWARDS.JOIN_BONUS);
			const refCount = await db.getReferralCount(user.id);
			const updatedUser = await db.getUser(user.id);
			await ctx.reply(MESSAGES.WALLET_SAVED.replace('{wallet}', text), { parse_mode: 'Markdown' });
			await ctx.reply(MESSAGES.DASHBOARD.replace('{name}', user.first_name).replace('{balance}', updatedUser!.balance.toString()).replace('{refs}', refCount.toString()), { reply_markup: mainKeyboard, parse_mode: 'Markdown' });
			return;
		}

		// Awaiting Withdraw Amount
		if (user.state === 'awaiting_withdraw_amount') {
			const amount = parseFloat(text);
			if (isNaN(amount) || amount <= 0) return ctx.reply("❌ *Invalid amount. Please enter a valid number.*", { parse_mode: 'Markdown' });
			if (amount < 30) return ctx.reply(MESSAGES.MIN_WITHDRAW, { parse_mode: 'Markdown' });
			if (amount > user.balance) return ctx.reply(MESSAGES.INSUFFICIENT_BALANCE.replace('{balance}', user.balance.toString()), { parse_mode: 'Markdown' });

			await db.updateState(user.id, 'awaiting_tx_hash', amount.toString());
			await ctx.reply(MESSAGES.NETWORK_FEE, { parse_mode: 'Markdown', reply_markup: cancelKeyboard });
			return;
		}

		// Awaiting Transaction Hash
		if (user.state === 'awaiting_tx_hash') {
			if (text.length < 10) return ctx.reply("❌ *Invalid Transaction Hash. Please provide a valid TxID.*", { parse_mode: 'Markdown' });
			
			const amount = parseFloat(user.temp_data!);
			const withdrawalId = await db.createWithdrawal(user.id, amount, text);
			await db.updateState(user.id, 'idle');

			await ctx.reply(MESSAGES.WITHDRAW_PENDING.replace('{tx_hash}', text), { parse_mode: 'Markdown', reply_markup: mainKeyboard });

			const adminId = parseInt(ctx.env.ADMIN_ID);
			if (adminId) {
				const adminMsg = MESSAGES.ADMIN_NEW_WITHDRAWAL
					.replace('{name}', user.first_name)
					.replace('{user_id}', user.id.toString())
					.replace('{amount}', amount.toString())
					.replace('{wallet}', user.wallet_address || 'Not Set')
					.replace('{tx_hash}', text);
				
				await ctx.api.sendMessage(adminId, adminMsg, { parse_mode: 'Markdown', reply_markup: adminApprovalKeyboard(withdrawalId) }).catch(console.error);
			}
			return;
		}

		// Main Menu Options
		if (text === '💰 Balance') {
			const refCount = await db.getReferralCount(user.id);
			await ctx.reply(MESSAGES.DASHBOARD.replace('{name}', user.first_name).replace('{balance}', user.balance.toString()).replace('{refs}', refCount.toString()), { parse_mode: 'Markdown' });
		} else if (text === '👥 Referral') {
			const botInfo = await ctx.api.getMe();
			await ctx.reply(MESSAGES.REFERRAL.replace('{bot_username}', botInfo.username).replace('{user_id}', user.id.toString()), { parse_mode: 'Markdown' });
		} else if (text === '📤 Withdraw') {
			if (user.balance < 30) return ctx.reply(MESSAGES.MIN_WITHDRAW, { parse_mode: 'Markdown' });
			await db.updateState(user.id, 'awaiting_withdraw_amount');
			await ctx.reply(MESSAGES.WITHDRAW_AMOUNT.replace('{balance}', user.balance.toString()), { parse_mode: 'Markdown', reply_markup: cancelKeyboard });
		} else if (text === '🔄 How It Works') {
			await ctx.reply(`1️⃣ Invite friends using your referral link.\n2️⃣ Earn ${REWARDS.REFERRAL_BONUS} USDT per valid invite.\n3️⃣ Withdraw to your BEP-20 wallet instantly!`, { parse_mode: 'Markdown' });
		}
	});
}
