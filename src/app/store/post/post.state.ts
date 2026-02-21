import { IPost } from '../../core/interfaces/post';

export interface PostState {
  posts:        IPost[];
  total:        number;
  page:         number;
  totalPages:   number;
  selectedPost: IPost | null;
  loading:      boolean;
  loadingMore:  boolean;
  error:        string | null;
}

export const initialPostState: PostState = {
  posts:        [],
  total:        0,
  page:         1,
  totalPages:   1,
  selectedPost: null,
  loading:      false,
  loadingMore:  false,
  error:        null,
};
