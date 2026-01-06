export type ReceiptType = 'RENT' | 'ADVANCE' | 'REFUND';

export type ReceiptCity = {
  s_no?: number;
  name?: string;
};

export type ReceiptState = {
  s_no?: number;
  name?: string;
};

export type ReceiptPgDetails = {
  pgId?: number;
  pgName?: string;
  address?: string;
  pincode?: string;
  city?: ReceiptCity;
  state?: ReceiptState;
};

export interface ReceiptData {
  receiptNumber: string;
  paymentDate: Date;
  tenantName: string;
  tenantPhone: string;
  pgName: string;
  pgDetails?: ReceiptPgDetails;
  roomNumber: string;
  bedNumber: string;
  rentPeriod: {
    startDate: Date;
    endDate: Date;
  };
  actualRent: number;
  amountPaid: number;
  paymentMethod: string;
  remarks?: string;
  receiptType?: ReceiptType;
}
