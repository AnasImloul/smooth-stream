import {StreamingMode} from "../strategies";

export type Observer<T> = {
  next?: (value: T) => void;
  error?: (err: any) => void;
  complete?: () => void;
};

export type Subscription = {
  unsubscribe: () => void;
}

export type ResponseQueueItem = {
  response: string;
  callback?: () => Promise<void> | void;
  streamingStrategy: StreamingStrategy;
  intervalMs: number;
}

export interface StreamingStrategy {
  stream(currentResponse: string, currentIndex: number, responseStream: (response: string) => void): Promise<number>;
}

export class Observable<T> {
  private observers: Observer<T>[] = [];
  
  subscribe(observer: Observer<T>): Subscription {
    this.observers.push(observer);
    return {unsubscribe: () => this.unsubscribe(observer)};
  }
  
  private unsubscribe(observer: Observer<T>) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }
  
  private async next(value: T) {
    const notifyPromises = this.observers.map(observer =>
      observer.next ? observer.next(value) : Promise.resolve()
    );
    await Promise.all(notifyPromises);
  }
  
  private async complete() {
    const notifyPromises = this.observers.map(observer =>
      observer.complete ? observer.complete() : Promise.resolve()
    );
    await Promise.all(notifyPromises);
  }
  
  protected async notifyNext(value: T) {
    await this.next(value);
  }
  
  protected async notifyComplete() {
    await this.complete();
  }
}

