import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-8 px-6 py-20">
      <div className="text-center">
        <p className="badge">HANCOM ACADEMY STUDIO</p>
        <h1 className="mt-6 font-display text-5xl text-ink md:text-6xl">
          문항 추출부터 시험지 제작까지
        </h1>
        <p className="mt-4 text-base text-slate md:text-lg">
          운영자, 교사, 학생을 위한 한 화면. 문서에 맞춘 프로세스를 그대로 구현했습니다.
        </p>
      </div>
      <div className="grid w-full gap-4 md:grid-cols-3">
        {[
          { href: "/operator", title: "운영자 콘솔", desc: "업로드, 추출, 검수까지 흐름 관리" },
          { href: "/teacher", title: "교사 콘솔", desc: "문항 검색과 시험지 제작" },
          { href: "/student", title: "학생 화면", desc: "시험지 목록과 풀이" },
        ].map((card) => (
          <Link key={card.href} href={card.href} className="card p-6 transition hover:-translate-y-1">
            <h2 className="font-display text-2xl text-ink">{card.title}</h2>
            <p className="mt-3 text-sm text-slate">{card.desc}</p>
            <span className="mt-6 inline-flex text-sm text-teal">바로 보기 →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
