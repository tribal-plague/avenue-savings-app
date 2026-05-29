import '../src/index.css'

export const metadata = {
  title: 'Avenue - Smart Expense Management',
  description: 'A standalone savings and household expense app with Cosmos-backed authentication.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
