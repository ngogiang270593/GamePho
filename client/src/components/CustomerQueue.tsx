import { CustomerCard } from './CustomerCard';
import type { Customer } from '../services/gameTypes';

interface CustomerQueueProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer) => void;
}

export function CustomerQueue({ customers, selectedCustomer, onSelect }: CustomerQueueProps) {
  return (
    <section className="customer-queue" aria-labelledby="queue-title">
      <div className="section-heading">
        <h2 id="queue-title">Khách đang chờ</h2>
        <span>{customers.length} khách</span>
      </div>
      {customers.length
        ? <div className="customer-list">{customers.map(customer => (
          <CustomerCard key={customer.id} customer={customer} isSelected={selectedCustomer?.id === customer.id} onSelect={() => onSelect(customer)} />
        ))}</div>
        : <p className="empty-state">Hẻm đang vắng khách. Bắt đầu ngày mới để đón khách nhé!</p>}
    </section>
  );
}
