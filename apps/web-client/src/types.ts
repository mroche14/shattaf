export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  features: string[];
}

export interface FAQItem {
  question: string;
  answer: string;
}
