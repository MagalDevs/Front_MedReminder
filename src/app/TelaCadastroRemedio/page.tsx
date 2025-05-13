import Sidebar from "../components/Sidebar/sidebar"
import BuscaMedicamento from "../components/CardBusca/cardBusca"
import ConfigurarLembrete from "../components/CardCadastrar/cardCadastrar"

export default function TelaCadastro() {
  return (
    <>
      <div className=" flex min-h-screen bg-[#E8E6E6]">
        <Sidebar />
        <div className="flex-1">
          <BuscaMedicamento />
          <ConfigurarLembrete />
        </div>
      </div>
    </>
  )
}