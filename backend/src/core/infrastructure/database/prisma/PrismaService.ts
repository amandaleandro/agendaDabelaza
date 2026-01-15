import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private _payment: any;
  private _refund: any;
  private _servicePlan: any;

  public get refund(): any {
    return this._refund;
  }
  public set refund(value: any) {
    this._refund = value;
  }
  public get payment(): any {
    return this._payment;
  }
  public set payment(value: any) {
    this._payment = value;
  }
  public get servicePlan(): any {
    return this._servicePlan;
  }
  public set servicePlan(value: any) {
    this._servicePlan = value;
  }
  private _subscription: any;
  public get subscription(): any {
    return this._subscription;
  }
  public set subscription(value: any) {
    this._subscription = value;
  }
  private _professional: any;
  public get professional(): any {
    return this._professional;
  }
  public set professional(value: any) {
    this._professional = value;
  }
  private _schedule: any;
  public get schedule(): any {
    return this._schedule;
  }
  public set schedule(value: any) {
    this._schedule = value;
  }
  private _service: any;
  public get service(): any {
    return this._service;
  }
  public set service(value: any) {
    this._service = value;
  }
  async onModuleInit() {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
