import AnimatedContent, { type AnimatedContentProps } from "@/components/reactbits/AnimatedContent";

// Saytın vahid giriş animasiyası: qısa məsafə, sürətli, gecikməsiz. Mətn gözlədilmir.
export function Appear({ distance = 24, duration = 0.6, ease = "power3.out", threshold = 0.08, ...props }: AnimatedContentProps) {
  return <AnimatedContent distance={distance} duration={duration} ease={ease} threshold={threshold} {...props} />;
}
