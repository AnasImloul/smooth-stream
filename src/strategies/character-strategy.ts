import { StreamingStrategy } from '../types';

export class CharacterStreamingStrategy implements StreamingStrategy {
  async stream(
    currentResponse: string,
    currentIndex: number,
    responseStream: (response: string) => void
  ): Promise<number> {
    responseStream(currentResponse.slice(0, ++currentIndex));
    return currentIndex;
  }
}
