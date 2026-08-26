export interface MortgageInput {
  price: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  propertyTax: number;
  insurance: number;
}

export function calculateMortgage({
  price,
  downPayment,
  interestRate,
  loanTerm,
  propertyTax,
  insurance,
}: MortgageInput) {
  const principal = Math.max(price - downPayment, 0);
  const monthlyRate = interestRate / 100 / 12;
  const months = loanTerm * 12;
  const mortgage =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate * (1 + monthlyRate) ** months) /
        ((1 + monthlyRate) ** months - 1);
  const taxes = propertyTax / 12;
  const total = mortgage + taxes + insurance;

  return {
    principal,
    mortgage,
    taxes,
    insurance,
    total,
  };
}
