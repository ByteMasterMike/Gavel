type Props = {
  greetingName: string;
  heroSubline: string;
};

export function DocketGreeting({ greetingName, heroSubline }: Props) {
  return (
    <div className="mb-2 lg:col-span-12">
      <h1 className="font-heading text-4xl font-extrabold tracking-tight text-[#e5e2e1] md:text-5xl">
        Good morning, {greetingName}.
      </h1>
      <p className="font-body mt-2 max-w-2xl text-base text-[#d1c5b4] md:text-lg">{heroSubline}</p>
    </div>
  );
}
