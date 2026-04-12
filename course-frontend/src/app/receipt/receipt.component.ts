import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-receipt',
  templateUrl: './receipt.component.html'
})
export class ReceiptComponent implements OnInit {

  enrollmentId!: number;
  receiptUrl!: string;

  ngOnInit() {
    this.enrollmentId = Number(location.pathname.split('/').pop());
    this.receiptUrl = `http://localhost:5000/api/payments/receipt/${this.enrollmentId}`;
  }

  downloadReceipt() {
    window.open(this.receiptUrl, '_blank');
  }
}