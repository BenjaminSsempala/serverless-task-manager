/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build to static HTML/JS in `out/` so Amplify can host it without a server.
  output: "export",
};

export default nextConfig;
