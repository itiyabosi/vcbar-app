export interface Connection {
  connectionId: string;
  userIdA: string;
  userIdB: string;
  createdAt: Date;
  location: string;
  notes: string;
  tags: string[];
}
