import { StreamingStrategy } from '../types';

export class WordStreamingStrategy implements StreamingStrategy {
  private async skipUntil(
    currentResponse: string,
    currentIndex: number,
    condition: (index: number) => boolean
  ): Promise<number> {
    while (currentIndex < currentResponse.length && !condition(currentIndex)) {
      currentIndex++;
    }
    return currentIndex;
  }

  private async skipHTMLTag(
    currentResponse: string,
    currentIndex: number
  ): Promise<number> {
    if (currentResponse[currentIndex] !== '<') return currentIndex;
    let depth = 0;
    do {
      if (currentResponse[currentIndex] === '<') depth++;
      else if (currentResponse[currentIndex] === '>') depth--;
      currentIndex++;
    } while (depth > 0 && currentIndex < currentResponse.length);
    return currentIndex;
  }

  async stream(
    currentResponse: string,
    currentIndex: number,
    responseStream: (response: string) => void
  ): Promise<number> {
    currentIndex = await this.skipHTMLTag(currentResponse, currentIndex);
    currentIndex = await this.skipUntil(
      currentResponse,
      currentIndex,
      (index) => currentResponse[index] === ' '
    );
    responseStream(currentResponse.slice(0, currentIndex));
    currentIndex = await this.skipUntil(
      currentResponse,
      currentIndex,
      (index) => currentResponse[index] !== ' '
    );
    return currentIndex;
  }
}
