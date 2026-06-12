import { useBootstrap } from '@/hooks/use-bootstrap';
import { useSse } from '@/hooks/use-sse';
import { EquityChart } from './equity-chart';
import { Header } from './header';
import { OrderTicket } from './order-ticket';
import { PositionsTable } from './positions-table';
import { PriceChart } from './price-chart';
import { TimeTravel } from './time-travel';

export function Dashboard() {
  useSse();
  useBootstrap();

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 p-4">
      <Header />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <PriceChart />
          <EquityChart />
        </div>
        <div className="flex flex-col gap-4">
          <OrderTicket />
          <PositionsTable />
          <TimeTravel />
        </div>
      </div>
    </div>
  );
}
