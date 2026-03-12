// Declaración de la función global gtag
declare function gtag(...args: any[]): void;
declare var dataLayer: any[]; // Permite usar 'dataLayer' sin 'window.'

interface Window {
  dataLayer: any[];
}
