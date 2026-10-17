// Shared row shape used by MemberList (full) and ViewTeam (read-only team view)
export const toRow = (m) => ({
  docId: m._id,
  id: m.memberId || m._id,
  superiorIdRaw: m.superiorId || '',
  basicInfo: {
    account: m.phoneNumber,
    nickname: m.nickname,
    level: m.vipLevel,
    superior: m.superiorId ? `User(${m.superiorId})` : '-',
    agent: m.superiorId ? `User(${m.superiorId})` : '-',
  },
  accountInfo: {
    type: m.userType || 'Regular User',
    status: m.status || 'Enabled',
    transactions: m.transactions || 'Enabled',
    credit: String(m.creditScore),
  },
  walletInfo: {
    availableFunds: Number(m.availableFunds || 0).toFixed(2),
    frozenFunds: Number(m.frozenFunds || 0).toFixed(2),
    totalDeposits: Number(m.totalDeposits || 0).toFixed(2),
    totalWithdrawals: Number(m.totalWithdrawals || 0).toFixed(2),
    totalCommissions: Number(m.totalCommissions || 0).toFixed(2),
  },
  taskStatus: `${m.taskStatus ?? 0}/30`,
  invitationCode: m.invitationCode || '-',
  invitationCodeRaw: m.invitationCode || '',
  loginInfo: {
    loginTime: m.lastLoginTime || m.registrationTime || '-',
    loginIp: m.lastLoginIp || '-',
  },
  registrationTime: m.registrationTime || '-',
  salaryPending: m.todaySalaryPendingPayment,
});