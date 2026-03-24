export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  nickname?: string;
  avatar?: string;
  password?: string;
  status: number;
  created_at: Date;
  updated_at: Date;
}

export interface JWTPayload {
  id: number;
  username: string;
  nickname?: string;
  email: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
}

export interface ImageGenerationParams {
  prompt: string;
  model?: 'dall-e-2' | 'dall-e-3';
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  n?: number;
}

export interface ImageGenerationResult {
  url: string;
  revised_prompt?: string;
}

export interface ImageRecord {
  id: number;
  user_id: number;
  prompt: string;
  image_url: string;
  model: string;
  created_at: Date;
}
