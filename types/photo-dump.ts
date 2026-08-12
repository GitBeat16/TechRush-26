export interface PhotoDumpImage {
  url: string;
  path: string;
  width?: number;
  height?: number;
}

export interface PhotoDumpComment {
  id: string;
  userId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface PhotoDump {
  id: string;
  tripId: string;
  ownerId: string;
  ownerName: string;
  ownerAvatarId?: string;
  caption: string;
  location: string;
  images: PhotoDumpImage[];
  takenOn: string;
  tags: string[];
  likeCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  comments: PhotoDumpComment[];
  createdAt: string;
}

export interface NewPhotoDump {
  images: Omit<PhotoDumpImage, "url">[];
  caption?: string;
  location?: string;
  takenOn?: string;
  tags?: string[];
}
