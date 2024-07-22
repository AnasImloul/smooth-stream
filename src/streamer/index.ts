import { Observer, Observable } from '../types';
import { StreamingStrategy } from "../types";

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