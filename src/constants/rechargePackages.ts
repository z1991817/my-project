export interface RechargePackage {
  id: string;
  name: string;
  amount: number;
  points: number;
}

export const RECHARGE_PACKAGES: RechargePackage[] = [
  { id: 'recharge_9_9', name: '1000积分', amount: 9.9, points: 1000 },
  { id: 'recharge_39_9', name: '4500积分', amount: 39.9, points: 4500 },
  { id: 'recharge_99', name: '15000积分', amount: 99, points: 15000 },
];

export function getRechargePackageById(packageId: string): RechargePackage | null {
  return RECHARGE_PACKAGES.find((item) => item.id === packageId) || null;
}
