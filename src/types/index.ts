export interface Person {
  id?: string;
  _id?: string;
  name: string;
  age: number;
  phone: string;
  aadharNumber: string;
  panNumber: string;
  voterIdNumber: string;
  gender: "Male" | "Female" | "Other";
  community: string;
  ward: string;
  address: string;
  street: string;
  direction: string;
  caste: string;
  religion: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface Message {
  id?: string;
  _id?: string;
  senderId: string;
  recipients: string[] | string;
  message: string;
  templateId?: string;
  direction?: string;
  status: "sent" | "pending" | "failed";
  sentAt?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface Template {
  id?: string;
  _id?: string;
  title: string;
  body: string;
  category?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

// Add the missing User type
export interface User {
  id?: string;
  _id?: string;
  email: string;
  role: "superadmin" | "admin";
  direction?: "North" | "South" | "East" | "West";
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}
