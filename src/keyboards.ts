import { Keyboard, InlineKeyboard } from 'grammy';

export const continueKeyboard = new InlineKeyboard().text('✅ Continue', 'action_continue');

export const cancelKeyboard = new Keyboard().text('❌ Cancel').resized().placeholder('Cancel current action...');

export const mainKeyboard = new Keyboard()
	.text('💰 Balance').text('👥 Referral').row()
	.text('📤 Withdraw').text('🔄 How It Works')
	.resized();

export const adminApprovalKeyboard = (withdrawId: number) => new InlineKeyboard()
	.text('✅ Approve', `approve_${withdrawId}`)
	.text('❌ Reject', `reject_${withdrawId}`);
	
export const adminPanelKeyboard = new Keyboard()
	.text('📊 Statistics').text('📢 Broadcast').row()
	.text('🏠 Back to User Menu')
	.resized();
