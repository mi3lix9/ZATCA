import { Tag } from '../tag';

export function createTagClass(tagId: number) {
  return class extends Tag {
    constructor(value: string) {
      super(tagId, value);
    }
  };
}
