package br.com.edrim2.chessacademy;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;

import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import java.util.concurrent.TimeUnit;

public final class UpdateNotificationScheduler {

    public static final String CHANNEL_ID =
            "chess_academy_updates";

    private static final String PERIODIC_WORK =
            "chess_academy_periodic_update_check";

    private static final String INITIAL_WORK =
            "chess_academy_initial_update_check";

    private UpdateNotificationScheduler() {}

    public static void createNotificationChannel(Context context) {

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Atualizações do Chess Academy",
                    NotificationManager.IMPORTANCE_DEFAULT
            );

            channel.setDescription(
                    "Notificações sobre novas versões e novidades."
            );

            NotificationManager manager =
                    context.getSystemService(NotificationManager.class);

            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
    public static void schedule(Context context) {

        Context appContext = context.getApplicationContext();

        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();

        OneTimeWorkRequest initialCheck =
                new OneTimeWorkRequest.Builder(UpdateCheckWorker.class)
                        .setConstraints(constraints)
                        .build();

        WorkManager.getInstance(appContext)
                .enqueueUniqueWork(
                        INITIAL_WORK,
                        ExistingWorkPolicy.KEEP,
                        initialCheck
                );

        PeriodicWorkRequest periodicCheck =
                new PeriodicWorkRequest.Builder(
                        UpdateCheckWorker.class,
                        12,
                        TimeUnit.HOURS
                )
                        .setConstraints(constraints)
                        .build();

        WorkManager.getInstance(appContext)
                .enqueueUniquePeriodicWork(
                        PERIODIC_WORK,
                        ExistingPeriodicWorkPolicy.KEEP,
                        periodicCheck
                );
    }
}