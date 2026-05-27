import { Keyboard, InlineKeyboard } from 'grammy';

export const continueKeyboard = new InlineKeyboard()
	.text('✅ Continue', 'action_continue');

export const cancelKeyboard = new Keyboard()
	.text('❌ Cancel')
	.resized()
	.placeholder('Cancel current action...');

export const mainKeyboard = new Keyboard()
	.text('💰 Balance').text('👥 Referral').row()
	.text('📤 Withdraw').text('🔄 How It Works')
	.resized();
