export interface PublicProductVariant {
  id: string;
  productId: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  color: string | null;
  size: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  position: number;
  color: string | null;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  brand: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicProductWithDetails extends Product {
  variants: PublicProductVariant[];
  images: ProductImage[];
}

export interface ApiResponse<T> {
  products: T[];
  total: number;
}

export interface CatalogFiltersData {
  categories: string[];
  colors: string[];
  sizes: string[];
}
