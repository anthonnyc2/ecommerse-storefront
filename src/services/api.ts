import type {
  PublicProductWithDetails,
  ApiResponse,
  CatalogFiltersData,
} from "../types/api";

const API_URL = import.meta.env.PUBLIC_API_URL;

export async function getLatestProducts(
  limit: number = 8,
): Promise<PublicProductWithDetails[]> {
  try {
    const url = `${API_URL}/products?limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Fetch error ${response.status}: ${url}`);
      throw new Error("Error fetching products");
    }
    const data: ApiResponse<PublicProductWithDetails> = await response.json();
    return data.products;
  } catch (error) {
    console.error("API Error (getLatestProducts):", error);
    return [];
  }
}

export async function getCatalogProducts(params: {
  category?: string;
  color?: string;
  size?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PublicProductWithDetails>> {
  try {
    const query = new URLSearchParams();
    if (params.category) query.append("category", params.category);
    if (params.color) query.append("colors", params.color);
    if (params.size) query.append("sizes", params.size);
    if (params.sort) query.append("sort", params.sort);
    if (params.page) query.append("page", params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());

    const url = `${API_URL}/products?${query.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Fetch error ${response.status}: ${url}`);
      throw new Error("Error fetching catalog");
    }
    return await response.json();
  } catch (error) {
    console.error("API Error (getCatalogProducts):", error);
    return { products: [], total: 0 };
  }
}

export async function getCatalogFilters(): Promise<CatalogFiltersData> {
  try {
    const url = `${API_URL}/products/filters`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Fetch error ${response.status}: ${url}`);
      throw new Error("Error fetching filters");
    }
    return await response.json();
  } catch (error) {
    console.error("API Error (getCatalogFilters):", error);
    return { categories: [], colors: [], sizes: [] };
  }
}

export async function getProductBySlug(
  slug: string,
): Promise<PublicProductWithDetails | null> {
  try {
    const response = await fetch(`${API_URL}/products/${slug}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return null;
  }
}
