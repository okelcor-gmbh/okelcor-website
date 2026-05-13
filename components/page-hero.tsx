import Image from "next/image";
import Reveal from "@/components/motion/reveal";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
  imageAlt?: string;
};

export default function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
  imageAlt = "",
}: PageHeroProps) {
  return (
    <section className="w-full pt-[76px] lg:pt-20">
      <div className="relative min-h-[62vh] overflow-hidden">
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/25" />

        <div className="relative z-10 flex min-h-[62vh] items-center justify-center px-6 text-center">
          <Reveal>
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.28em] text-white/70">
                {eyebrow}
              </p>
              <h1 className="mx-auto mt-4 max-w-5xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-7xl">
                {title}
              </h1>
              <p className="mx-auto mt-5 max-w-3xl text-[1rem] leading-7 text-white/85 md:text-[1.08rem] md:leading-8">
                {subtitle}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}