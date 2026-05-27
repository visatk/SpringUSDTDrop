export const MESSAGES = {
	WELCOME: `🎁 *Welcome to The Biggest Spring USDT Airdrop* 🌸\n\nCelebrate the season of new beginnings with our massive USDT giveaway.\n\n🌷 *Spring Bonus:* 30 USDT — just for joining\n🌿 *Referral Bloom:* 8 USDT for every friend you bring\n\nTap ✅ *Continue* below to bloom your rewards.`,
	ASK_WALLET: `🔄 *Wallet reset.*\n\n📦 Please enter your *USDT wallet address (BEP-20 only)*:`,
	ASK_WITHDRAW_WALLET: `🔘 *Please submit your USDT (BEP-20, TRC-20, ERC-20, BASE) wallet address below.*\n\nMust Submit Valid Wallet Address from any network.`,
	WALLET_SAVED: `✅ *Wallet saved!*\n\n👛 {wallet}\n\nTo change your wallet later, use /start`,
	DASHBOARD: `🏠 *Dashboard*\n\nHey {name}, welcome back!\n\n💰 *Balance:* {balance} USDT\n👥 *Referrals:* {refs}`,
	REFERRAL: `🔗 *Your Referral Link:*\n\`https://t.me/{bot_username}?start={user_id}\`\n\nShare this link to earn 8 USDT per friend!`,
	WITHDRAW_AMOUNT: `✅ *Enter Total Amount Which You Want To Withdraw?*\n\n💰 *Your Total Balance:* {balance} USDT`,
	INSUFFICIENT_BALANCE: `❌ *Insufficient Balance!* You only have {balance} USDT.`,
	MIN_WITHDRAW: `❌ *Minimum withdrawal is 30 USDT.*`,
	NETWORK_FEE: `📢 *Network Fees Required!*\n\n🔐 Please send *0.00644 BNB, 0.00205 ETH, or 15 TRX* as a gas fee to withdraw your USDT tokens.\n\n💰 *Pay Gas Fees now* to receive your USDT instantly!\n\n🏷 *Payment Methods:*\n\n🔸 *BNB (BEP20):*\n\`0xYourAdminBnbAddressHere\`\nSend: 0.00644 BNB\n\n🔹 *ETH (ERC20):*\n\`0xYourAdminEthAddressHere\`\nSend: 0.00205 ETH\n\n🔺 *TRX (TRC20):*\n\`TYourAdminTrxAddressHere\`\nSend: 15 TRX\n\n⚠️ *Only Send Exact amount of Network Fees to receive USDT.*\n\n👇 *Submit your Transaction Hash (TxID) below after payment:*`,
	WITHDRAW_PENDING: `⏳ *Withdrawal Request Submitted!*\n\nYour transaction hash: \`{tx_hash}\`\nAdmin will verify your gas fee payment and approve the withdrawal shortly.`,
	WITHDRAW_APPROVED: `🎉 *Withdrawal Approved!*\n\nYour {amount} USDT has been successfully sent to your wallet.`,
	WITHDRAW_REJECTED: `❌ *Withdrawal Rejected!*\n\nInvalid transaction fee or hash. Your balance has been refunded. Please contact support.`,
	ADMIN_NEW_WITHDRAWAL: `🚨 *New Withdrawal Request*\n\nUser: [{name}](tg://user?id={user_id})\nID: \`{user_id}\`\nAmount: {amount} USDT\nWithdrawal Wallet: \`{wallet}\`\nTx Hash: \`{tx_hash}\`\n\nPlease approve or reject:`,
	INVALID_WALLET: `❌ *Invalid Format!*\nPlease enter a valid BEP-20 (0x...) wallet address.`,
	CANCELLED: `✅ *Action Cancelled.*`
};

export const REWARDS = {
	JOIN_BONUS: 30,
	REFERRAL_BONUS: 8
};
