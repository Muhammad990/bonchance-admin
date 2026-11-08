/*
 * index.js — Page registry: sidebar sub-item title -> page component.
 *
 * Add a new page: create the component file in this folder, then register
 * it (or any other title) in PAGE_COMPONENTS below. Tabs whose title is
 * not registered fall back to the generic placeholder in AdminView.
 */
import ProductList from './ProductList.jsx';
import MembershipLevelList from './MembershipLevelList.jsx';
import MemberList from './MemberList.jsx';
import PointsRecords from './PointsRecords.jsx';
import BankCardList from './BankCardList.jsx';
import WithdrawalOrders from './WithdrawalOrders.jsx';
import RechargeOrders from './RechargeOrders.jsx';
import WalletDetails from './WalletDetails.jsx';
import OrderList from './OrderList.jsx';
import AddOrder from './AddOrder.jsx';
import ViewTeam from './ViewTeam.jsx';
import AccountToData from './AccountToData.jsx';
import ChangePassword from './ChangePassword.jsx';
import SystemSettings from './SystemSettings.jsx';
import BasicSetting from './BasicSetting.jsx';
import ChangeUsername from './ChangeUsername.jsx';

export const PAGE_COMPONENTS = {
  'Product List': ProductList,
  'Membership Level List': MembershipLevelList,
  'Member List': MemberList,
  'Points Records': PointsRecords,
  'Bank Card List': BankCardList,
  'Withdrawal Orders': WithdrawalOrders,
  'Recharge Orders': RechargeOrders,
  'Wallet Details': WalletDetails,
  'Order List': OrderList,
  'Add Order': AddOrder,
  'Credentials': ChangePassword,
  'Change Password': ChangePassword,
  'System Settings': SystemSettings,
  'Basic Setting': BasicSetting,
  'Change Username': ChangeUsername,
};

// Returns the page component for a tab title, or null if not registered
export function resolvePage(title) {
  if (typeof title === 'string' && title.startsWith('View Team')) return ViewTeam;
  if (typeof title === 'string' && title.startsWith('Account to Data')) return AccountToData;
  return PAGE_COMPONENTS[title] || null;
}