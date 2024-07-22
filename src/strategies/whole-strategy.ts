import { StreamingStrategy } from '../types';

export class WholeStreamingStrategy implements StreamingStrategy {
  async stream(
    currentResponse: string,
    currentIndex: number,
    responseStream: (response: string) => void
  ): Promise<number> {
    responseStream(currentResponse);
    return currentResponse.length;
  }
}
