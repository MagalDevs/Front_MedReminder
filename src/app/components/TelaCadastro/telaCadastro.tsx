import Sidebar from "../Sidebar/sidebar"
import BuscaMedicamento from "../CardBusca/cardBusca"
import ConfigurarLembrete from "../CardCadastrar/cardCadastrar"

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