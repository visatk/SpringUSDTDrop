import { Bot } from 'grammy';
import { MyContext } from '../types';
import { MESSAGES, REWARDS } from '../constants';
import { continueKeyboard, mainKeyboard, cancelKeyboard } from '../keyboards';
import { DBManager } from './state';

export function setupUserHandlers(bot: Bot<MyContext>) {
	// --- START COMMAND ---
	bot.command('start', async (ctx) => {
		const db = new DBManager(ctx.env.DB);
		const user = ctx.from!;
		const referredBy = ctx.match ? parseInt(ctx.match) : undefined;
		
		const existingUser = await db.getUser(user.id);
		
		if (!existingUser) {
			// Prevent self-referral
			const validReferral = (referredBy && referredBy !== user.id) ? referredBy : undefined;
			await db.createUser(user.id, user.first_name, user.username, validReferral);
            
            if(validReferral) {
                // Reward the referrer instantly (Growth Hacking)
                await db.addReferralBonus(validReferral, REWARDS.REFERRAL_BONUS);
            }
		}

		await db.updateState(user.id, 'idle');
		await ctx.reply(MESSAGES.WELCOME, { reply_markup: continueKeyboard, parse_mode: 'Markdown' });
	});

	// --- INLINE CONTINUE BUTTON ---
	bot.callbackQuery('action_continue', async (ctx) => {
		const db = new DBManager(ctx.env.DB);
		await db.updateState(ctx.from.id, 'awaiting_wallet');
		await ctx.answerCallbackQuery();
		await ctx.reply(MESSAGES.ASK_WALLET, { reply_markup: cancelKeyboard, parse_mode: 'Markdown' });
	});

	// --- TEXT MESSAGES HANDLER ---
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

		// Handle State: Awaiting Wallet
		if (user.state === 'awaiting_wallet') {
			const bep20Regex = /^0x[a-fA-F0-9]{40}$/;
			if (!bep20Regex.test(text)) {
				await ctx.reply(MESSAGES.INVALID_WALLET, { parse_mode: 'Markdown' });
				return;
			}

			await db.saveWalletAndReward(user.id, text, REWARDS.JOIN_BONUS);
			
			// Fetch updated data for Dashboard
			const updatedUser = await db.getUser(user.id);
			const refCount = await db.getReferralCount(user.id);

			await ctx.reply(MESSAGES.WALLET_SAVED.replace('{wallet}', text), { parse_mode: 'Markdown' });
			await ctx.reply(
				MESSAGES.DASHBOARD
					.replace('{name}', user.first_name)
					.replace('{balance}', updatedUser!.balance.toString())
					.replace('{refs}', refCount.toString()),
				{ reply_markup: mainKeyboard, parse_mode: 'Markdown' }
			);
			return;
		}

		// Handle Main Menu
		if (text === '💰 Balance') {
			const refCount = await db.getReferralCount(user.id);
			await ctx.reply(
				MESSAGES.DASHBOARD
					.replace('{name}', user.first_name)
					.replace('{balance}', user.balance.toString())
					.replace('{refs}', refCount.toString()),
				{ parse_mode: 'Markdown' }
			);
		} 
		else if (text === '👥 Referral') {
			const botInfo = await ctx.api.getMe();
			await ctx.reply(MESSAGES.REFERRAL.replace('{bot_username}', botInfo.username).replace('{user_id}', user.id.toString()), { parse_mode: 'Markdown' });
		} 
		else if (text === '📤 Withdraw') {
			await ctx.reply(MESSAGES.WITHDRAW_NOTICE, { parse_mode: 'Markdown' });
		}
		else if (text === '🔄 How It Works') {
			await ctx.reply(`1️⃣ Invite friends using your referral link.\n2️⃣ Earn ${REWARDS.REFERRAL_BONUS} USDT per valid invite.\n3️⃣ Wait for the season to end for auto-distribution!`, { parse_mode: 'Markdown' });
		}
	});
}
