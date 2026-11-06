<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function (Model $model) {
            $model->recordAuditLog('criação');
        });

        static::updated(function (Model $model) {
            $model->recordAuditLog('edição');
        });

        static::deleted(function (Model $model) {
            $model->recordAuditLog('exclusão');
        });
    }

    public function recordAuditLog(string $action): void
    {
        $collection = $this->getCollectionName();
        $label = $this->getAuditLabel();

        AuditLog::create([
            'collection' => $collection,
            'action' => $action,
            'label' => $label,
            'user_id' => auth()->id(),
        ]);
    }

    public function getCollectionName(): string
    {
        return property_exists($this, 'collectionName') ? $this->collectionName : $this->getTable();
    }

    public function getAuditLabel(): string
    {
        return (string) ($this->nome ?? $this->titulo ?? $this->descricao ?? $this->membro ?? $this->id);
    }
}

