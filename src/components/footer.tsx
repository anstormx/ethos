import Link from "next/link";

export default function Footer() {
  return (
    <div className="text-semibold w-full py-[1%] text-center">
      made with ❤️ by{" "}
      <Link
        href="https://github.com/anstormx"
        target="_blank"
        className="text-blue-500 transition duration-200 hover:text-blue-400"
      >
        anstorm
      </Link>
    </div>
  );
}
