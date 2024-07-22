type Observer<T> = {
  next?: (value: T) => void;
  error?: (err: any) => void;
  complete?: () => void;
};

class Observable<T> {
  private observers: Observer<T>[] = [];
  
  subscribe(observer: Observer<T>): () => void {
    this.observers.push(observer);
    return () => this.unsubscribe(observer);
  }
  
  private unsubscribe(observer: Observer<T>) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }
  
  private next(value: T) {
    this.observers.forEach(observer => observer.next && observer.next(value));
  }
  
  private complete() {
    this.observers.forEach(observer => observer.complete && observer.complete());
    this.observers = [];
  }
  
  protected notifyNext(value: T) {
    this.next(value);
  }
  
  protected notifyComplete() {
    this.complete();
  }
}

export enum StreamingMode {
  CHARACTER,
  WORD,
  WHOLE,
}

export function getStreamingStrategy(streamingMode: StreamingMode) {
  switch (streamingMode) {
    case StreamingMode.CHARACTER:
      return new CharacterStreamingStrategy();
    case StreamingMode.WORD:
      return new WordStreamingStrategy();
    case StreamingMode.WHOLE:
      return new WholeStreamingStrategy();
  }
}

export interface StreamingStrategy {
  stream(currentResponse: string, currentIndex: number, responseStream: (response: string) => void): Promise<number>;
}

export class CharacterStreamingStrategy implements StreamingStrategy {
  async stream(currentResponse: string, currentIndex: number, responseStream: (response: string) => void): Promise<number> {
    responseStream(currentResponse.slice(0, ++currentIndex));
    return currentIndex;
  }
}

export class WordStreamingStrategy implements StreamingStrategy {
  private async skipUntil(
    currentResponse: string,
    currentIndex: number,
    condition: (index: number) => boolean,
  ): Promise<number> {
    while (currentIndex < currentResponse.length && !condition(currentIndex)) {
      currentIndex++;
    }
    return currentIndex;
  }
  
  private async skipHTMLTag(currentResponse: string, currentIndex: number): Promise<number> {
    if (currentResponse[currentIndex] !== '<') return currentIndex;
    let depth = 0;
    do {
      if (currentResponse[currentIndex] === '<') depth++;
      else if (currentResponse[currentIndex] === '>') depth--;
      currentIndex++;
    } while (depth > 0 && currentIndex < currentResponse.length);
    return currentIndex;
  }
  
  async stream(currentResponse: string, currentIndex: number, responseStream: (response: string) => void): Promise<number> {
    currentIndex = await this.skipHTMLTag(currentResponse, currentIndex);
    currentIndex = await this.skipUntil(
      currentResponse,
      currentIndex,
      (index) => currentResponse[index] === ' ',
    );
    responseStream(currentResponse.slice(0, currentIndex));
    currentIndex = await this.skipUntil(
      currentResponse,
      currentIndex,
      (index) => currentResponse[index] !== ' ',
    );
    return currentIndex;
  }
}

export class WholeStreamingStrategy implements StreamingStrategy {
  async stream(currentResponse: string, currentIndex: number, responseStream: (response: string) => void): Promise<number> {
    responseStream(currentResponse);
    return currentResponse.length;
  }
}

export class SmoothStreamer {
  private currentResponse = '';
  private currentIndex = 0;
  private responseQueue: { response: string, callback?: () => void }[] = [];
  private isStreaming = false;
  private responseStream = new Observable<string>();
  private onStreamEndObservable = new Observable<void>();
  private callbackLock =  false;
  
  constructor(
    private intervalMs: number = 0,
    private streamingStrategy: StreamingStrategy,
    private prefixMatching: boolean = false,
  ) {}
  
  public setInterval(intervalMs: number) {
    this.intervalMs = intervalMs;
    if (this.isStreaming) {
      void this.restartStreaming();
    }
    return this;
  }
  
  public setStreamingStrategy(streamingStrategy: StreamingStrategy) {
    this.streamingStrategy = streamingStrategy;
    return this;
  }
  
  public subscribe(next?: (value: string) => void, error?: (err: any) => void, complete?: () => void) {
    const observer: Observer<string> = { next, error, complete };
    return this.responseStream.subscribe(observer);
  }
  
  public onStreamEnd(callback: () => void) {
    return this.onStreamEndObservable.subscribe({next: callback});
  }
  
  public flush() {
    this.currentResponse = '';
    this.currentIndex = 0;
    this.responseQueue = [];
    this.isStreaming = false;
  }
  
  public next(response: string, callback?: () => void) {
    this.responseQueue.push({ response, callback });
    if (!this.isStreaming && !this.callbackLock) {
      void this.processQueue();
    }
  }
  
  private async processQueue() {
    if (this.responseQueue.length === 0 || this.responseQueue[0] === undefined) {
      this.responseStream['notifyComplete']();
      this.onStreamEndObservable['notifyNext']();
      return;
    }
    
    const { response, callback } = this.responseQueue[0];
    const previousResponse = this.currentResponse;
    if (this.prefixMatching) {
      this.currentResponse = response;
      this.currentIndex = this.longestCommonPrefix(previousResponse, this.currentResponse);
    } else {
      this.currentResponse += response;
    }
    await this.startStreaming();
    this.responseQueue.shift();
    this.runCallbackWithLock(callback);
    void this.processQueue();
  }
  
  private async startStreaming() {
    this.isStreaming = true;
    while (this.currentIndex < this.currentResponse.length) {
      this.currentIndex = await this.streamingStrategy.stream(
        this.currentResponse,
        this.currentIndex,
        this.responseStream['notifyNext'].bind(this.responseStream),
      );
      await this.delay(this.intervalMs);
    }
    this.isStreaming = false;
  }
  
  private runCallbackWithLock(callback?: () => void) {
    this.callbackLock = true;
    callback?.();
    this.callbackLock = false;
  }
  
  private longestCommonPrefix(previousResponse: string, currentResponse: string) {
    const minLength = Math.min(previousResponse.length, currentResponse.length);
    for (let i = 0; i < minLength; i++) {
      if (previousResponse[i] !== currentResponse[i]) {
        return i;
      }
    }
    return minLength;
  }
  
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private async restartStreaming() {
    this.isStreaming = false;
    await this.startStreaming();
  }
}