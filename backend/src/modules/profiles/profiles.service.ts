import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataStoreService } from '../../database/data-store';
import { BusinessProfile } from '../../database/models';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProfilesService {
  constructor(private readonly dataStore: DataStoreService) {}

  findAll(userId: string): BusinessProfile[] {
    return this.dataStore.getProfiles(userId);
  }

  findOne(userId: string, id: string): BusinessProfile {
    const profile = this.dataStore.getProfiles(userId).find((p) => p.id === id);
    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }
    return profile;
  }

  create(userId: string, dto: CreateProfileDto): BusinessProfile {
    const sub = this.dataStore.getSubscription(userId);
    const currentCount = this.dataStore.getProfiles(userId).length;

    if (sub.profilesLimit !== null && currentCount >= sub.profilesLimit) {
      throw new BadRequestException(
        `Business profile limit reached (${sub.profilesLimit} on ${sub.tierName} plan). Upgrade your plan to manage additional business profiles.`,
      );
    }

    if (dto.isDefault) {
      this.dataStore.getProfiles(userId).forEach((p) => {
        p.isDefault = false;
      });
    }

    const now = new Date().toISOString();
    const profile: BusinessProfile = {
      id: uuidv4(),
      userId,
      name: dto.name,
      legalName: dto.legalName,
      email: dto.email,
      phone: dto.phone,
      website: dto.website,
      address: dto.address,
      city: dto.city,
      country: dto.country,
      postalCode: dto.postalCode,
      taxNumber: dto.taxNumber,
      currency: dto.currency,
      defaultPaymentTermsDays: dto.defaultPaymentTermsDays || 30,
      isDefault: !!dto.isDefault || currentCount === 0,
      bankDetails: dto.bankDetails,
      createdAt: now,
      updatedAt: now,
    };

    this.dataStore.getProfiles(userId).push(profile);
    sub.activeProfilesCount = this.dataStore.getProfiles(userId).length;
    this.dataStore.save();
    return profile;
  }

  update(userId: string, id: string, dto: Partial<UpdateProfileDto>): BusinessProfile {
    const profile = this.findOne(userId, id);

    if (dto.isDefault) {
      this.dataStore.getProfiles(userId).forEach((p) => {
        p.isDefault = false;
      });
    }

    Object.assign(profile, dto);
    profile.updatedAt = new Date().toISOString();
    this.dataStore.save();
    return profile;
  }

  setDefault(userId: string, id: string): BusinessProfile {
    const target = this.findOne(userId, id);
    this.dataStore.getProfiles(userId).forEach((p) => {
      p.isDefault = p.id === id;
    });
    this.dataStore.save();
    return target;
  }

  delete(userId: string, id: string) {
    const list = this.dataStore.getProfiles(userId);
    if (list.length <= 1) {
      throw new BadRequestException('Cannot delete the last business profile.');
    }
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }
    list.splice(idx, 1);
    // Ensure at least one profile is default
    if (!list.some((p) => p.isDefault)) {
      list[0].isDefault = true;
    }
    this.dataStore.getSubscription(userId).activeProfilesCount = list.length;
    this.dataStore.save();
    return { success: true, id };
  }
}
