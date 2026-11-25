import { Injectable, NotFoundException } from '@nestjs/common';
import { DataStoreService } from '../../database/data-store';
import { Client } from '../../database/models';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ClientsService {
  constructor(private readonly dataStore: DataStoreService) {}

  findAll(userId: string): Client[] {
    const clients = this.dataStore.getClients(userId);
    const invoices = this.dataStore.getInvoices(userId);

    // Recalculate dynamic totals based on actual invoices
    return clients.map((c) => {
      const clientInvoices = invoices.filter((i) => i.clientId === c.id || i.clientEmail.toLowerCase() === c.email.toLowerCase());
      const totalBilled = Math.round(clientInvoices.reduce((acc, i) => acc + i.total, 0) * 100) / 100;
      const outstandingBalance = Math.round(
        clientInvoices.filter((i) => i.status !== 'paid' && i.status !== 'cancelled').reduce((acc, i) => acc + i.balanceDue, 0) * 100,
      ) / 100;

      return {
        ...c,
        totalBilled,
        outstandingBalance,
      };
    });
  }

  findOne(userId: string, id: string): Client {
    const client = this.findAll(userId).find((c) => c.id === id);
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    return client;
  }

  create(userId: string, dto: CreateClientDto): Client {
    const now = new Date().toISOString();
    const client: Client = {
      id: uuidv4(),
      userId,
      name: dto.name,
      companyName: dto.companyName,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      city: dto.city,
      country: dto.country,
      taxNumber: dto.taxNumber,
      currency: dto.currency,
      notes: dto.notes,
      totalBilled: 0,
      outstandingBalance: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.dataStore.getClients(userId).push(client);
    this.dataStore.addActivity(userId, {
      type: 'client_added',
      title: `Client Added: ${client.companyName}`,
      description: `New client relationship registered for ${client.name}`,
    });
    this.dataStore.save();
    return client;
  }

  update(userId: string, id: string, dto: Partial<UpdateClientDto>): Client {
    const client = this.dataStore.getClients(userId).find((c) => c.id === id);
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    Object.assign(client, dto);
    client.updatedAt = new Date().toISOString();
    this.dataStore.save();
    return this.findOne(userId, id);
  }

  delete(userId: string, id: string) {
    const list = this.dataStore.getClients(userId);
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    list.splice(idx, 1);
    this.dataStore.save();
    return { success: true, id };
  }
}
