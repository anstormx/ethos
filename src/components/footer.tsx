import Link from "next/link";

export default function Footer() {
  return (
    <div className="w-full py-[1%] text-center">
    made with ❤️ by{" "}
      <Link
        href="https://github.com/anstormx"
        target="_blank"
        className="text-blue-500 hover:text-blue-400 transition duration-200"
      >
        anstorm
      </Link>
    </div>
  );
}