import { ACOS_LOGO, ACOS_LOGO_HORIZONTAL, ACOS_LOGO_HORIZONTAL_NEGATIVE, ACOS_SYMBOL } from './acos-logo';

/** Official artwork: vector tracing of the original artwork supplied by ACOS on 13 November 2026. */
export default function BrandLogo({ variant = 'horizontal', compact = false }: {
  variant?: 'primary' | 'horizontal' | 'negative' | 'symbol';
  compact?: boolean;
}) {
  const source = variant === 'primary' ? ACOS_LOGO : variant === 'negative' ? ACOS_LOGO_HORIZONTAL_NEGATIVE : variant === 'symbol' ? ACOS_SYMBOL : ACOS_LOGO_HORIZONTAL;
  return <picture className={'acos-mark acos-mark-' + variant + (compact ? ' acos-mark-responsive' : '')}>
    {compact && <source media="(max-width: 580px)" srcSet={ACOS_SYMBOL} />}
    <img src={source} alt="ACOS · Correduría de Seguros y Fianzas" width={variant === 'symbol' ? 440 : 1360} height={385} />
  </picture>;
}
