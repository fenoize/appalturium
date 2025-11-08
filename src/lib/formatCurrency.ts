export function formatCurrency(value: number, currency: "CLP" | "UF" | "USD" = "CLP"): string {
  switch (currency) {
    case "CLP":
      return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    
    case "UF":
      return `UF ${new Intl.NumberFormat("es-CL", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      }).format(value)}`;
    
    case "USD":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    
    default:
      return value.toString();
  }
}

export function getCurrencySymbol(currency: "CLP" | "UF" | "USD" = "CLP"): string {
  switch (currency) {
    case "CLP":
      return "$";
    case "UF":
      return "UF";
    case "USD":
      return "USD $";
    default:
      return "$";
  }
}
