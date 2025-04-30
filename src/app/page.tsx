import Sidebar from "./components/Sidebar/sidebar"
import Cardbusca from "./components/CardBusca/cardBusca"

export default function Home() {
  return (
    <>
      <div className=" flex min-h-screen bg-[#E8E6E6]">
        <Sidebar />
        <div className="flex-1">
          <Cardbusca />
        </div>
      </div>
    </>
  )
}