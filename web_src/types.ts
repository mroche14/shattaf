
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  features: string[];
}

export interface BookingDetails {
  location: string;
  date: string;
  time: string;
  modelId: string;
  customerName: string;
  email: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}
