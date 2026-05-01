import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-receipt',
  templateUrl: './receipt.component.html'
})
export class ReceiptComponent implements OnInit {

  enrollmentId!: number;
  receiptUrl!: string;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.enrollmentId = Number(this.route.snapshot.paramMap.get('id'));
    this.receiptUrl = `https://coursehub-production-b7b9.up.railway.app/api/payments/receipt/${this.enrollmentId}`;
  }

  downloadReceipt(): void {
    window.open(this.receiptUrl, '_blank');
  }
}