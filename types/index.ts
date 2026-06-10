export interface Channel {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  banner: string;
  subscribers: string;
  subscriberCount: number;
  description: string;
  videoCount: number;
  verified: boolean;
  joinedDate: string;
  totalViews: string;
  links: { title: string; url: string }[];
}

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelId: string;
  channelName: string;
  channelAvatar: string;
  views: string;
  viewCount: number;
  uploadedAt: string;
  duration: string;
  description: string;
  likes: string;
  likeCount: number;
  dislikes: string;
  category: string;
  tags: string[];
  videoUrl: string;
  isShort?: boolean;
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  likes: string;
  postedAt: string;
  replies?: Comment[];
}

export interface SearchResult {
  type: 'video' | 'channel';
  video?: Video;
  channel?: Channel;
}

export interface Category {
  id: string;
  label: string;
}

export type SidebarSection = {
  title?: string;
  items: SidebarItem[];
};

export type SidebarItem = {
  icon: string;
  label: string;
  href: string;
  active?: boolean;
};
