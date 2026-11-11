import { ACOS_LOGO, ACOS_LOGO_HORIZONTAL, ACOS_LOGO_HORIZONTAL_NEGATIVE, ACOS_SYMBOL } from './acos-logo';

/** Official artwork embedded in the supplied brand manual; never recreated with text. */
export default function BrandLogo({ variant = 'horizontal', compact = false }: {
  variant?: 'primary' | 'horizontal' | 'negative' | 'symbol';
  compact?: boolean;
}) {
  const source = variant === 'primary' ? ACOS_LOGO : variant === 'negative' ? ACOS_LOGO_HORIZONTAL_NEGATIVE : variant === 'symbol' ? ACOS_SYMBOL : ACOS_LOGO_HORIZONTAL;
  return <picture className={'acos-mark acos-mark-' + variant + (compact ? ' acos-mark-responsive' : '')}>
    {compact && <source media="(max-width: 580px)" srcSet={ACOS_SYMBOL} />}
    <img src={source} alt="ACOS · Correduría de Seguros" width={1400} height={variant === 'primary' ? 1268 : variant === 'symbol' ? 1187 : 431} />
  </picture>;
}
