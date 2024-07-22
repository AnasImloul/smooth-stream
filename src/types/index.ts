export type Observer<T> = {
  next?: (value: T) => void;
  error?: (err: any) => void;
  complete?: () => void;
};

export type Subscription = {
  unsubscribe: () => void;
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